namespace TCCControleDeAcesso.Views
{
    partial class frmTrocandoSenha
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.txtNovaSenha = new System.Windows.Forms.TextBox();
            this.txtNovaSenha2 = new System.Windows.Forms.TextBox();
            this.btnAlterarSenha = new System.Windows.Forms.Button();
            this.chkBoxMostrarSenha = new System.Windows.Forms.CheckBox();
            this.panel1 = new System.Windows.Forms.Panel();
            this.label1 = new System.Windows.Forms.Label();
            this.label4 = new System.Windows.Forms.Label();
            this.panel1.SuspendLayout();
            this.SuspendLayout();
            // 
            // txtNovaSenha
            // 
            this.txtNovaSenha.Location = new System.Drawing.Point(69, 303);
            this.txtNovaSenha.Name = "txtNovaSenha";
            this.txtNovaSenha.Size = new System.Drawing.Size(344, 20);
            this.txtNovaSenha.TabIndex = 3;
            // 
            // txtNovaSenha2
            // 
            this.txtNovaSenha2.Location = new System.Drawing.Point(69, 355);
            this.txtNovaSenha2.Name = "txtNovaSenha2";
            this.txtNovaSenha2.Size = new System.Drawing.Size(344, 20);
            this.txtNovaSenha2.TabIndex = 5;
            // 
            // btnAlterarSenha
            // 
            this.btnAlterarSenha.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.btnAlterarSenha.FlatStyle = System.Windows.Forms.FlatStyle.Popup;
            this.btnAlterarSenha.Font = new System.Drawing.Font("Dubai", 12F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.btnAlterarSenha.Location = new System.Drawing.Point(159, 406);
            this.btnAlterarSenha.Name = "btnAlterarSenha";
            this.btnAlterarSenha.Size = new System.Drawing.Size(152, 61);
            this.btnAlterarSenha.TabIndex = 6;
            this.btnAlterarSenha.Text = "Alterar Senha";
            this.btnAlterarSenha.UseVisualStyleBackColor = false;
            this.btnAlterarSenha.Click += new System.EventHandler(this.btnAlterarSenha_Click);
            // 
            // chkBoxMostrarSenha
            // 
            this.chkBoxMostrarSenha.AutoSize = true;
            this.chkBoxMostrarSenha.Font = new System.Drawing.Font("Arial Narrow", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.chkBoxMostrarSenha.Location = new System.Drawing.Point(182, 473);
            this.chkBoxMostrarSenha.Name = "chkBoxMostrarSenha";
            this.chkBoxMostrarSenha.Size = new System.Drawing.Size(107, 24);
            this.chkBoxMostrarSenha.TabIndex = 7;
            this.chkBoxMostrarSenha.Text = "Mostrar senha";
            this.chkBoxMostrarSenha.UseVisualStyleBackColor = true;
            this.chkBoxMostrarSenha.CheckedChanged += new System.EventHandler(this.chkBoxMostrarSenha_CheckedChanged);
            // 
            // panel1
            // 
            this.panel1.BackgroundImage = global::TCCControleDeAcesso.Properties.Resources.Design_sem_nome__13_1;
            this.panel1.Controls.Add(this.label1);
            this.panel1.Controls.Add(this.chkBoxMostrarSenha);
            this.panel1.Controls.Add(this.btnAlterarSenha);
            this.panel1.Controls.Add(this.txtNovaSenha2);
            this.panel1.Controls.Add(this.txtNovaSenha);
            this.panel1.Controls.Add(this.label4);
            this.panel1.Location = new System.Drawing.Point(747, 236);
            this.panel1.Name = "panel1";
            this.panel1.Size = new System.Drawing.Size(476, 558);
            this.panel1.TabIndex = 13;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Font = new System.Drawing.Font("Calibri", 11.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label1.Location = new System.Drawing.Point(66, 281);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(84, 18);
            this.label1.TabIndex = 0;
            this.label1.Text = "Nova senha:";
            // 
            // label4
            // 
            this.label4.AutoSize = true;
            this.label4.Font = new System.Drawing.Font("Calibri", 11.25F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.label4.Location = new System.Drawing.Point(66, 334);
            this.label4.Name = "label4";
            this.label4.Size = new System.Drawing.Size(141, 18);
            this.label4.TabIndex = 9;
            this.label4.Text = "Repetir a nova senha:";
            // 
            // frmTrocandoSenha
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 14F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.SystemColors.ControlLightLight;
            this.ClientSize = new System.Drawing.Size(1853, 933);
            this.Controls.Add(this.panel1);
            this.Font = new System.Drawing.Font("Arial", 8.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point, ((byte)(0)));
            this.Name = "frmTrocandoSenha";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "frmTrocandoSenha";
            this.WindowState = System.Windows.Forms.FormWindowState.Maximized;
            this.Load += new System.EventHandler(this.frmTrocandoSenha_Load);
            this.panel1.ResumeLayout(false);
            this.panel1.PerformLayout();
            this.ResumeLayout(false);

        }

        #endregion
        private System.Windows.Forms.TextBox txtNovaSenha;
        private System.Windows.Forms.TextBox txtNovaSenha2;
        private System.Windows.Forms.Button btnAlterarSenha;
        private System.Windows.Forms.CheckBox chkBoxMostrarSenha;
        private Guna.UI2.WinForms.Guna2AnimateWindow guna2AnimateWindow1;
        private System.Windows.Forms.Panel panel1;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label4;
    }
}