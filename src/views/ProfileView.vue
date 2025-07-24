<template>
    <BaseView>
        <template #header>
            <ScreenHeader>Проифиль</ScreenHeader>
        </template>

        <TabsComponent class="-mx-6">
            <TabList>
                <TabButton
                    :selected="currentTab === 'profile'"
                    aria-controls="profilePaneProfile"
                    @click="currentTab = 'profile'"
                >
                    Профиль
                </TabButton>
            </TabList>

            <TabPanelContainer>
                <TabPanel  v-show="currentTab === 'profile'" id="profilePaneProfile" aria-labelledby="profilePaneProfile">
                        <ProfileForm />
                </TabPanel>
            </TabPanelContainer>
        </TabsComponent>
    </BaseView>
</template>

<script>
import BaseView from './BaseView.vue';
import ScreenHeader from '@/components/Ui/ScreenHeader.vue';
import TabsComponent from '@/components/Ui/Tabs/TabsComponent.vue';
import TabList from '@/components/Ui/Tabs/TabList.vue';
import TabButton from '@/components/Ui/Tabs/TabButton.vue';
import TabPanelContainer from '@/components/Ui/Tabs/TabPanelContainer.vue';
import TabPanel from '@/components/Ui/Tabs/TabPanel.vue';
import ProfileForm from '@/components/Profile/ProfileForm.vue';

import { useLocalStorage } from '@/composables';

export default {
    name: 'ProfileView',

    components: {
        BaseView,
        ScreenHeader,
        TabsComponent,
        TabList,
        TabButton,
        TabPanelContainer,
        TabPanel,
        ProfileForm
    },

    data() {
        return {
          currentTab: this.getInitialTab(),
        }
  },
  
  methods: {
    setTab(tab) {
      this.currentTab = tab;
      this.setTabInLocalStorage(tab);
    },
    
    getInitialTab() {
      const { get } = useLocalStorage();
      return get('profileScreenTab', 'profile');
    },
    
    setTabInLocalStorage(tab) {
      const { set } = useLocalStorage();
      set('profileScreenTab', tab);
    }
  },

  watch: {
    currentTab: function (newTab) {
      this.setTabInLocalStorage(newTab);
    }
  }
}
</script>