using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;


namespace TCCControleDeAcesso.Views
{
   
    public partial class frmMainMenu : Form
    {

 
       

        
        public frmMainMenu(string currentUsername)
        {
            InitializeComponent();
            label2.Text = currentUsername;

           
        }

        private void btnLogout_Click(object sender, EventArgs e)
        {
            frmLogin check = new frmLogin();         
            check.Show();
            Hide();
        }
    }
}
